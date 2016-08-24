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

var Versionned = require('./Versionned.js');
var immutable = require('seamless-immutable');

// Describes a Flow

/**
 * Describes a Flow. Immutable value.
 * @constructor
 * @augments Versionned
 * @param {string} id          Globally unique UUID identifier for the Flow.
 * @param {string} version     String formatted PTP timestamp
 *                             (&lt;<em>seconds</em>&gt;:&lt;<em>nanoseconds</em>&gt;)
 *                             indicating precisely when an attribute of the resource
 *                             last changed.
 * @param {string} label       Freeform string label for the Flow.
 * @param {string} description Detailed description of the Flow.
 * @param {string} format      [Format]{@link formats} of the data coming from the
 *                             Flow as a URN.
 * @param {Object.<string, string[]>} tags Key value set of freeform string tags
 *                                         to aid in filtering Flows. Can be empty.
 * @param {string} source_id   Globally unique UUID for the [source]{@link Source}
 *                             which initially created the Flow.
 * @param {string[]} parents   Array of UUIDs representing the Flow IDs of Grains
 *                             which came together to generate this Flow. (May
 *                             change over the lifetime of this Flow).
 * @param {Object} grain_rate  Number of grains per second for this Flow - only
 *                             used if Flow is periodic: numerator/denominator -
 *                             denominator only required if non-integer rate.
 *                             From v1.1.
 */
function Flow(id, version, label, description, format,
    tags, source_id, parents, grain_rate) {
  this.id = this.generateID(id);
  this.version = this.generateVersion(version);
  this.label = this.generateLabel(label);
  /**
   * Detailed description of the Flow.
   * @type {string}
   * @readonly
   */
  this.description = this.generateDescription(description);
  /**
   * [Format]{@link formats} of the data coming from the Flow as a URN.
   * @type {string}
   * @readonly
   */
  this.format = this.generateFormat(format);
  /**
   * Key value set of freeform string tags to aid in filtering Flows. Can be
   * empty.
   * @type {Array.<string, string[]>}
   * @readonly
   */
  this.tags = this.generateTags(tags); // Treating as a required property
  /**
   * Globally unique UUID identifier for the [source]{@link Source} which initially
   * created the Flow.
   * @type {string}
   * @readonly
   */
  this.source_id = this.generateSourceID(source_id);
  /**
   * Array of UUIDs representing the Flow IDs of Grains which came together to
   * generate this Flow. (May change over the lifetime of this Flow.)
   */
  this.parents = this.generateParents(parents);
  /**
   * Number of grains per second for this Flow - only used if Flow is periodic:
   * numerator/denominator - denominator only required if non-integer rate.
   * @param  {Object}
   * @readonly
   */
  this.grain_rate = this.generateGrainRate(grain_rate);
  return immutable(this, { prototype: Flow.prototype });
}

Flow.prototype.validID = Versionned.prototype.validID;
Flow.prototype.generateID = Versionned.prototype.generateID;
Flow.prototype.validVersion = Versionned.prototype.validVersion;
Flow.prototype.generateVersion = Versionned.prototype.generateVersion;
Flow.prototype.validLabel = Versionned.prototype.validLabel;
Flow.prototype.generateLabel = Versionned.prototype.generateLabel;

Flow.prototype.validDescription = Versionned.prototype.validLabel;
Flow.prototype.generateDescription = Versionned.prototype.generateLabel;

Flow.prototype.validFormat = Versionned.prototype.validFormat;
Flow.prototype.generateFormat = Versionned.prototype.generateFormat;

Flow.prototype.validTags = Versionned.prototype.validTags;
Flow.prototype.generateTags = Versionned.prototype.generateTags;

Flow.prototype.validSourceID = Versionned.prototype.validID;
Flow.prototype.generateSourceID = Versionned.prototype.generateID;

Flow.prototype.validParents = function (parents) {
  if (arguments.length === 0) return this.validParents(this.parents);
  return Versionned.prototype.validUUIDArray(parents);
}
Flow.prototype.generateParents = Versionned.prototype.generateUUIDArray;

Flow.prototype.validGrainRate = function (grain_rate) {
  if (arguments.length === 0) return this.validGrainRate(this.grain_rate);
  if (typeof grain_rate === 'undefined') return true;
  if (typeof grain_rate !== 'object') return false;
  if (Array.isArray(grain_rate)) return false;
  var numeratorFound = false;
  Object.keys(grain_rate).forEach(function (k) {
    switch (k) {
      case 'numerator':
        if (typeof grain_rate[k] !== 'number') return false;
        if (grain_rate[k] % 1.0 !== 0.0) return false;
        numeratorFound = true;
        break;
      case 'denominator':
        if (typeof grain_rate[k] !== 'number') return false;
        if (grain_rate[k] % 1.0 !== 0.0) return false;
        if (grain_rate[k] === 0) return false;
        break;
      default:
        return false;
    }
  });
  return numeratorFound;
}
Flow.prototype.generateGrainRate = function (grain_rate) {
  if (typeof grain_rate !== 'object' || Array.isArray(grain_rate) || grain_rate === null)
    return undefined;
  Object.keys(grain_rate).forEach(function (k) {
    switch (k.toLowerCase()) {
      case 'numerator':
        var nValue = grain_rate[k];
        delete grain_rate[k];
        grain_rate.numerator = (typeof nValue === 'number') ? nValue | 0 : 25;
        break;
      case 'denominator':
       var dValue = grain_rate[k];
       delete grain_rate[k];
       grain_rate.denominator = (typeof dValue === 'number') ? dValue | 0 : 1;
       break;
      default:
        delete grain_rate[k];
        break;
    }
  });
  if (!grain_rate.numerator) grain_rate.numerator = 25;
  return grain_rate;
}

Flow.prototype.valid = function() {
  return this.validID(this.id) &&
    this.validVersion(this.version) &&
    this.validLabel(this.label) &&
    this.validDescription(this.description) &&
    this.validFormat(this.format) &&
    this.validTags(this.tags) &&
    this.validSourceID(this.source_id) &&
    this.validParents(this.parents) &&
    this.validGrainRate(this.grain_rate);
}

Flow.prototype.stringify = function () { return JSON.stringify(this); }
//   return JSON.stringify(this, function (key, value) {
//     if (typeof value === undefined) { return undefined; }
//     return value;
//   });
// };

Flow.prototype.parse = function (json) {
  if (json === null || json === undefined || arguments.length === 0 ||
      (typeof json !== 'string' && typeof json !== 'object'))
    throw "Cannot parse JSON to a Flow value because it is not a valid input.";
  var parsed = (typeof json === 'string') ? JSON.parse(json) : json;
  return new Flow(parsed.id, parsed.version, parsed.label, parsed.description,
      parsed.format, parsed.tags, parsed.source_id, parsed.parents, parsed.grain_rate);
}

// Flow.prototype.asVersion(v) = function {
//   switch (v) {
//     case 1.0:
//       return this.without('grain_rate');
//     default:
//       return this;
//   }
// }

Flow.isFlow = function (x) {
  return x !== null &&
    typeof x === 'object' &&
    x.constructor === Flow.prototype.constructor;
}

module.exports = Flow;
