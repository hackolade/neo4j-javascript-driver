"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

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
function generateFieldLookup(keys) {
  var lookup = {};
  keys.forEach(function (name, idx) {
    lookup[name] = idx;
  });
  return lookup;
}
/**
 * Records make up the contents of the {@link Result}, and is how you access
 * the output of a query. A simple query might yield a result stream
 * with a single record, for instance:
 *
 *     MATCH (u:User) RETURN u.name, u.age
 *
 * This returns a stream of records with two fields, named `u.name` and `u.age`,
 * each record represents one user found by the query above. You can access
 * the values of each field either by name:
 *
 *     record.get("u.name")
 *
 * Or by it's position:
 *
 *     record.get(0)
 *
 * @access public
 */


var Record =
/*#__PURE__*/
function () {
  /**
   * Create a new record object.
   * @constructor
   * @protected
   * @param {string[]} keys An array of field keys, in the order the fields appear in the record
   * @param {Array} fields An array of field values
   * @param {Object} fieldLookup An object of fieldName -> value index, used to map
   *                            field names to values. If this is null, one will be
   *                            generated.
   */
  function Record(keys, fields) {
    var fieldLookup = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    (0, _classCallCheck2["default"])(this, Record);

    /**
     * Field keys, in the order the fields appear in the record.
     * @type {string[]}
     */
    this.keys = keys;
    /**
     * Number of fields
     * @type {Number}
     */

    this.length = keys.length;
    this._fields = fields;
    this._fieldLookup = fieldLookup || generateFieldLookup(keys);
  }
  /**
   * Run the given function for each field in this record. The function
   * will get three arguments - the value, the key and this record, in that
   * order.
   *
   * @param {function(value: Object, key: string, record: Record)} visitor the function to apply to each field.
   */


  (0, _createClass2["default"])(Record, [{
    key: "forEach",
    value: function forEach(visitor) {
      for (var i = 0; i < this.keys.length; i++) {
        visitor(this._fields[i], this.keys[i], this);
      }
    }
    /**
     * Run the given function for each field in this record. The function
     * will get three arguments - the value, the key and this record, in that
     * order.
     *
     * @param {function(value: Object, key: string, record: Record)} visitor the function to apply on each field
     * and return a value that is saved to the returned Array.
     *
     * @returns {Array}
     */

  }, {
    key: "map",
    value: function map(visitor) {
      var resultArray = [];

      for (var i = 0; i < this.keys.length; i++) {
        resultArray.push(visitor(this._fields[i], this.keys[i], this));
      }

      return resultArray;
    }
    /**
     * Generates an object out of the current Record
     *
     * @returns {Object}
     */

  }, {
    key: "toObject",
    value: function toObject() {
      var object = {};
      this.forEach(function (value, key) {
        object[key] = value;
      });
      return object;
    }
    /**
     * Get a value from this record, either by index or by field key.
     *
     * @param {string|Number} key Field key, or the index of the field.
     * @returns {*}
     */

  }, {
    key: "get",
    value: function get(key) {
      var index;

      if (!(typeof key === 'number')) {
        index = this._fieldLookup[key];

        if (index === undefined) {
          throw (0, _error.newError)("This record has no field with key '" + key + "', available key are: [" + this.keys + '].');
        }
      } else {
        index = key;
      }

      if (index > this._fields.length - 1 || index < 0) {
        throw (0, _error.newError)("This record has no field with index '" + index + "'. Remember that indexes start at `0`, " + 'and make sure your query returns records in the shape you meant it to.');
      }

      return this._fields[index];
    }
    /**
     * Check if a value from this record, either by index or by field key, exists.
     *
     * @param {string|Number} key Field key, or the index of the field.
     * @returns {boolean}
     */

  }, {
    key: "has",
    value: function has(key) {
      // if key is a number, we check if it is in the _fields array
      if (typeof key === 'number') {
        return key >= 0 && key < this._fields.length;
      } // if it's not a number, we check _fieldLookup dictionary directly


      return this._fieldLookup[key] !== undefined;
    }
  }]);
  return Record;
}();

var _default = Record;
exports["default"] = _default;