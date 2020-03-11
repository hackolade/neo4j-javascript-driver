"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _result = _interopRequireDefault(require("./result"));

var _util = require("./internal/util");

var _connectionHolder = _interopRequireWildcard(require("./internal/connection-holder"));

var _bookmark = _interopRequireDefault(require("./internal/bookmark"));

var _txConfig = _interopRequireDefault(require("./internal/tx-config"));

var _streamObservers = require("./internal/stream-observers");

var _error = require("./error");

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
 * Represents a transaction in the Neo4j database.
 *
 * @access public
 */
var Transaction =
/*#__PURE__*/
function () {
  /**
   * @constructor
   * @param {ConnectionHolder} connectionHolder - the connection holder to get connection from.
   * @param {function()} onClose - Function to be called when transaction is committed or rolled back.
   * @param {function(bookmark: Bookmark)} onBookmark callback invoked when new bookmark is produced.
   * @param {boolean} reactive whether this transaction generates reactive streams
   * @param {number} fetchSize - the record fetch size in each pulling batch.
   */
  function Transaction(_ref) {
    var connectionHolder = _ref.connectionHolder,
        onClose = _ref.onClose,
        onBookmark = _ref.onBookmark,
        reactive = _ref.reactive,
        fetchSize = _ref.fetchSize;
    (0, _classCallCheck2["default"])(this, Transaction);
    this._connectionHolder = connectionHolder;
    this._reactive = reactive;
    this._state = _states.ACTIVE;
    this._onClose = onClose;
    this._onBookmark = onBookmark;
    this._onError = this._onErrorCallback.bind(this);
    this._onComplete = this._onCompleteCallback.bind(this);
    this._fetchSize = fetchSize;
    this._results = [];
  }

  (0, _createClass2["default"])(Transaction, [{
    key: "_begin",
    value: function _begin(bookmark, txConfig) {
      var _this = this;

      this._connectionHolder.getConnection().then(function (conn) {
        return conn.protocol().beginTransaction({
          bookmark: bookmark,
          txConfig: txConfig,
          mode: _this._connectionHolder.mode(),
          database: _this._connectionHolder.database(),
          beforeError: _this._onError,
          afterComplete: _this._onComplete
        });
      })["catch"](function (error) {
        return _this._onError(error);
      });
    }
    /**
     * Run Cypher query
     * Could be called with a query object i.e.: `{text: "MATCH ...", parameters: {param: 1}}`
     * or with the query and parameters as separate arguments.
     * @param {mixed} query - Cypher query to execute
     * @param {Object} parameters - Map with parameters to use in query
     * @return {Result} New Result
     */

  }, {
    key: "run",
    value: function run(query, parameters) {
      var _validateQueryAndPara = (0, _util.validateQueryAndParameters)(query, parameters),
          validatedQuery = _validateQueryAndPara.validatedQuery,
          params = _validateQueryAndPara.params;

      var result = this._state.run(validatedQuery, params, {
        connectionHolder: this._connectionHolder,
        onError: this._onError,
        onComplete: this._onComplete,
        reactive: this._reactive,
        fetchSize: this._fetchSize
      });

      this._results.push(result);

      return result;
    }
    /**
     * Commits the transaction and returns the result.
     *
     * After committing the transaction can no longer be used.
     *
     * @returns {Promise<void>} An empty promise if committed successfully or error if any error happened during commit.
     */

  }, {
    key: "commit",
    value: function commit() {
      var committed = this._state.commit({
        connectionHolder: this._connectionHolder,
        onError: this._onError,
        onComplete: this._onComplete,
        pendingResults: this._results
      });

      this._state = committed.state; // clean up

      this._onClose();

      return new Promise(function (resolve, reject) {
        committed.result.subscribe({
          onCompleted: function onCompleted() {
            return resolve();
          },
          onError: function onError(error) {
            return reject(error);
          }
        });
      });
    }
    /**
     * Rollbacks the transaction.
     *
     * After rolling back, the transaction can no longer be used.
     *
     * @returns {Promise<void>} An empty promise if rolled back successfully or error if any error happened during
     * rollback.
     */

  }, {
    key: "rollback",
    value: function rollback() {
      var rolledback = this._state.rollback({
        connectionHolder: this._connectionHolder,
        onError: this._onError,
        onComplete: this._onComplete,
        pendingResults: this._results
      });

      this._state = rolledback.state; // clean up

      this._onClose();

      return new Promise(function (resolve, reject) {
        rolledback.result.subscribe({
          onCompleted: function onCompleted() {
            return resolve();
          },
          onError: function onError(error) {
            return reject(error);
          }
        });
      });
    }
    /**
     * Check if this transaction is active, which means commit and rollback did not happen.
     * @return {boolean} `true` when not committed and not rolled back, `false` otherwise.
     */

  }, {
    key: "isOpen",
    value: function isOpen() {
      return this._state === _states.ACTIVE;
    }
  }, {
    key: "_onErrorCallback",
    value: function _onErrorCallback(err) {
      // error will be "acknowledged" by sending a RESET message
      // database will then forget about this transaction and cleanup all corresponding resources
      // it is thus safe to move this transaction to a FAILED state and disallow any further interactions with it
      this._state = _states.FAILED;

      this._onClose(); // release connection back to the pool


      return this._connectionHolder.releaseConnection();
    }
  }, {
    key: "_onCompleteCallback",
    value: function _onCompleteCallback(meta) {
      this._onBookmark(new _bookmark["default"](meta.bookmark));
    }
  }]);
  return Transaction;
}();

var _states = {
  // The transaction is running with no explicit success or failure marked
  ACTIVE: {
    commit: function commit(_ref2) {
      var connectionHolder = _ref2.connectionHolder,
          onError = _ref2.onError,
          onComplete = _ref2.onComplete,
          pendingResults = _ref2.pendingResults;
      return {
        result: finishTransaction(true, connectionHolder, onError, onComplete, pendingResults),
        state: _states.SUCCEEDED
      };
    },
    rollback: function rollback(_ref3) {
      var connectionHolder = _ref3.connectionHolder,
          onError = _ref3.onError,
          onComplete = _ref3.onComplete,
          pendingResults = _ref3.pendingResults;
      return {
        result: finishTransaction(false, connectionHolder, onError, onComplete, pendingResults),
        state: _states.ROLLED_BACK
      };
    },
    run: function run(query, parameters, _ref4) {
      var connectionHolder = _ref4.connectionHolder,
          onError = _ref4.onError,
          onComplete = _ref4.onComplete,
          reactive = _ref4.reactive,
          fetchSize = _ref4.fetchSize;
      // RUN in explicit transaction can't contain bookmarks and transaction configuration
      // No need to include mode and database name as it shall be inclued in begin
      var observerPromise = connectionHolder.getConnection().then(function (conn) {
        return conn.protocol().run(query, parameters, {
          bookmark: _bookmark["default"].empty(),
          txConfig: _txConfig["default"].empty(),
          beforeError: onError,
          afterComplete: onComplete,
          reactive: reactive,
          fetchSize: fetchSize
        });
      })["catch"](function (error) {
        return new _streamObservers.FailedObserver({
          error: error,
          onError: onError
        });
      });
      return newCompletedResult(observerPromise, query, parameters);
    }
  },
  // An error has occurred, transaction can no longer be used and no more messages will
  // be sent for this transaction.
  FAILED: {
    commit: function commit(_ref5) {
      var connectionHolder = _ref5.connectionHolder,
          onError = _ref5.onError,
          onComplete = _ref5.onComplete;
      return {
        result: newCompletedResult(new _streamObservers.FailedObserver({
          error: (0, _error.newError)('Cannot commit this transaction, because it has been rolled back either because of an error or explicit termination.'),
          onError: onError
        }), 'COMMIT', {}),
        state: _states.FAILED
      };
    },
    rollback: function rollback(_ref6) {
      var connectionHolder = _ref6.connectionHolder,
          onError = _ref6.onError,
          onComplete = _ref6.onComplete;
      return {
        result: newCompletedResult(new _streamObservers.CompletedObserver(), 'ROLLBACK', {}),
        state: _states.FAILED
      };
    },
    run: function run(query, parameters, _ref7) {
      var connectionHolder = _ref7.connectionHolder,
          onError = _ref7.onError,
          onComplete = _ref7.onComplete,
          reactive = _ref7.reactive;
      return newCompletedResult(new _streamObservers.FailedObserver({
        error: (0, _error.newError)('Cannot run query in this transaction, because it has been rolled back either because of an error or explicit termination.'),
        onError: onError
      }), query, parameters);
    }
  },
  // This transaction has successfully committed
  SUCCEEDED: {
    commit: function commit(_ref8) {
      var connectionHolder = _ref8.connectionHolder,
          onError = _ref8.onError,
          onComplete = _ref8.onComplete;
      return {
        result: newCompletedResult(new _streamObservers.FailedObserver({
          error: (0, _error.newError)('Cannot commit this transaction, because it has already been committed.'),
          onError: onError
        }), 'COMMIT', {}),
        state: _states.SUCCEEDED
      };
    },
    rollback: function rollback(_ref9) {
      var connectionHolder = _ref9.connectionHolder,
          onError = _ref9.onError,
          onComplete = _ref9.onComplete;
      return {
        result: newCompletedResult(new _streamObservers.FailedObserver({
          error: (0, _error.newError)('Cannot rollback this transaction, because it has already been committed.'),
          onError: onError
        }), 'ROLLBACK', {}),
        state: _states.SUCCEEDED
      };
    },
    run: function run(query, parameters, _ref10) {
      var connectionHolder = _ref10.connectionHolder,
          onError = _ref10.onError,
          onComplete = _ref10.onComplete,
          reactive = _ref10.reactive;
      return newCompletedResult(new _streamObservers.FailedObserver({
        error: (0, _error.newError)('Cannot run query in this transaction, because it has already been committed.'),
        onError: onError
      }), query, parameters);
    }
  },
  // This transaction has been rolled back
  ROLLED_BACK: {
    commit: function commit(_ref11) {
      var connectionHolder = _ref11.connectionHolder,
          onError = _ref11.onError,
          onComplete = _ref11.onComplete;
      return {
        result: newCompletedResult(new _streamObservers.FailedObserver({
          error: (0, _error.newError)('Cannot commit this transaction, because it has already been rolled back.'),
          onError: onError
        }), 'COMMIT', {}),
        state: _states.ROLLED_BACK
      };
    },
    rollback: function rollback(_ref12) {
      var connectionHolder = _ref12.connectionHolder,
          onError = _ref12.onError,
          onComplete = _ref12.onComplete;
      return {
        result: newCompletedResult(new _streamObservers.FailedObserver({
          error: (0, _error.newError)('Cannot rollback this transaction, because it has already been rolled back.')
        }), 'ROLLBACK', {}),
        state: _states.ROLLED_BACK
      };
    },
    run: function run(query, parameters, _ref13) {
      var connectionHolder = _ref13.connectionHolder,
          onError = _ref13.onError,
          onComplete = _ref13.onComplete,
          reactive = _ref13.reactive;
      return newCompletedResult(new _streamObservers.FailedObserver({
        error: (0, _error.newError)('Cannot run query in this transaction, because it has already been rolled back.'),
        onError: onError
      }), query, parameters);
    }
  }
  /**
   *
   * @param {boolean} commit
   * @param {ConnectionHolder} connectionHolder
   * @param {function(err:Error): any} onError
   * @param {function(metadata:object): any} onComplete
   * @param {list<Result>>}pendingResults all run results in this transaction
   */

};

function finishTransaction(commit, connectionHolder, onError, onComplete, pendingResults) {
  var observerPromise = connectionHolder.getConnection().then(function (connection) {
    pendingResults.forEach(function (r) {
      return r._cancel();
    });
    return Promise.all(pendingResults).then(function (results) {
      if (commit) {
        return connection.protocol().commitTransaction({
          beforeError: onError,
          afterComplete: onComplete
        });
      } else {
        return connection.protocol().rollbackTransaction({
          beforeError: onError,
          afterComplete: onComplete
        });
      }
    });
  })["catch"](function (error) {
    return new _streamObservers.FailedObserver({
      error: error,
      onError: onError
    });
  }); // for commit & rollback we need result that uses real connection holder and notifies it when
  // connection is not needed and can be safely released to the pool

  return new _result["default"](observerPromise, commit ? 'COMMIT' : 'ROLLBACK', {}, connectionHolder);
}
/**
 * Creates a {@link Result} with empty connection holder.
 * For cases when result represents an intermediate or failed action, does not require any metadata and does not
 * need to influence real connection holder to release connections.
 * @param {ResultStreamObserver} observer - an observer for the created result.
 * @param {string} query - the cypher query that produced the result.
 * @param {Object} parameters - the parameters for cypher query that produced the result.
 * @return {Result} new result.
 * @private
 */


function newCompletedResult(observerPromise, query, parameters) {
  return new _result["default"](Promise.resolve(observerPromise), query, parameters, _connectionHolder.EMPTY_CONNECTION_HOLDER);
}

var _default = Transaction;
exports["default"] = _default;