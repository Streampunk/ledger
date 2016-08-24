/* Copyright 2016 Streampunk Media Ltd.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

// Deep equals except that ignores dangling undefined values in either object

var assert = require('assert');

module.exports = deepishEqual = function (actual, expected) {
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return false;
    var pairwise = true;
    var index = 0;
    while ( pairwise === true && index < actual.length) {
      parisewise = deepishEqual(actual[index], expected[index]);
      index++;
    }
    return pairwise;
  }
  if (actual !== null && typeof actual === 'object' &&
      expected !== null && typeof expected === 'object') {
    var actualProps = Object.keys(actual).every(function (k) {
      switch (typeof actual[k]) {
        case 'object':
          return deepishEqual(actual[k], expected[k]);
        case 'undefined':
          return true;
        default:
          return actual[k] === expected[k];
      };
    });
    var expectedProps = Object.keys(expected).every(function (k) {
      switch (typeof expected[k]) {
        case 'object':
          return deepishEqual(actual[k], expected[k]);
        case 'undefined':
          return true;
        default:
          return actual[k] === expected[k];
      };
    });
    return actualProps && expectedProps;
  }
  return actual === expected;
}
